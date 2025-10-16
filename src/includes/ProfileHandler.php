<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class ProfileHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        // Update profile endpoint
        register_rest_route('home-portal/v1', '/update-profile', [
            'methods' => 'POST',
            'callback' => [$this, 'update_profile'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);

        // Fetch current user endpoint
        register_rest_route('home-portal/v1', '/me', [
            'methods' => 'GET',
            'callback' => [$this, 'get_current_user'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);
    }

    public function get_current_user() {
        $user_id = get_current_user_id();
        if (!$user_id) return ['success' => false, 'message' => 'Not logged in'];

        $user_data = get_userdata($user_id);

        // Fetch meta: support both camelCase and snake_case
        $company = get_user_meta($user_id, 'companyName', true) ?: get_user_meta($user_id, 'company_name', true);
        $street  = get_user_meta($user_id, 'streetAddress', true) ?: get_user_meta($user_id, 'street_address', true);
        $zip     = get_user_meta($user_id, 'zipCode', true) ?: get_user_meta($user_id, 'zip_code', true);
        $city    = get_user_meta($user_id, 'city', true);
        $state   = get_user_meta($user_id, 'state', true);
        $avatar  = get_user_meta($user_id, 'avatar', true);

        return [
            'success' => true,
            'user' => [
                'id'            => $user_data->ID,
                'username'      => $user_data->user_login,
                'firstName'     => $user_data->first_name,
                'lastName'      => $user_data->last_name,
                'email'         => $user_data->user_email,
                'role'          => array_values((array)$user_data->roles),
                'companyName'   => $company,
                'streetAddress' => $street,
                'zipCode'       => $zip,
                'city'          => $city,
                'state'         => $state,
                'avatar'        => $avatar,
            ]
        ];
    }

    public function update_profile($request) {
        $user_id = get_current_user_id();
        $data = $request->get_json_params();

        if (!$user_id) return ['success' => false, 'message' => 'User not logged in'];

        $user_data = get_userdata($user_id);
        $roles = (array) $user_data->roles;

        // Update username safely
        if (!empty($data['username'])) {
            $new_username = sanitize_user($data['username']);
            if ($new_username !== $user_data->user_login && !username_exists($new_username)) {
                wp_update_user(['ID' => $user_id, 'user_login' => $new_username]);
            }
        }

        // Update core fields
        if (isset($data['firstName']) || isset($data['lastName'])) {
            wp_update_user([
                'ID' => $user_id,
                'first_name' => sanitize_text_field($data['firstName'] ?? ''),
                'last_name'  => sanitize_text_field($data['lastName'] ?? ''),
            ]);
        }

        if (!empty($data['email'])) {
            wp_update_user(['ID' => $user_id, 'user_email' => sanitize_email($data['email'])]);
        }

        // Update company if Local Provider
        if (in_array('local_provider', $roles, true) && isset($data['companyName'])) {
            update_user_meta($user_id, 'companyName', sanitize_text_field($data['companyName']));
            update_user_meta($user_id, 'company_name', sanitize_text_field($data['companyName']));
        }

        // Update meta fields (both camelCase and snake_case)
        $meta_map = [
            'streetAddress' => 'street_address',
            'zipCode'       => 'zip_code',
            'city'          => 'city',
            'state'         => 'state',
        ];

        foreach ($meta_map as $camel => $snake) {
            if (isset($data[$camel])) {
                update_user_meta($user_id, $camel, sanitize_text_field($data[$camel]));
                update_user_meta($user_id, $snake, sanitize_text_field($data[$camel]));
            }
        }

        // Handle avatar upload (base64)
        if (!empty($data['avatar']) && strpos($data['avatar'], 'data:image') === 0) {
            list(, $avatar_data) = explode(',', $data['avatar']);
            $avatar_data = base64_decode($avatar_data);

            $upload_dir = wp_upload_dir();
            $dir = trailingslashit($upload_dir['basedir']) . 'profile-avatars/';
            if (!file_exists($dir)) wp_mkdir_p($dir);

            $file_name = 'avatar-' . $user_id . '-' . time() . '.png';
            $file_path = $dir . $file_name;
            file_put_contents($file_path, $avatar_data);

            $avatar_url = trailingslashit($upload_dir['baseurl']) . 'profile-avatars/' . $file_name;
            update_user_meta($user_id, 'avatar', esc_url_raw($avatar_url));
        }

        return $this->get_current_user();
    }
}
