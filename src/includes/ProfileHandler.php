<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class ProfileHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        // Route for getting current user info
        register_rest_route('home-portal/v1', '/me', [
            'methods' => 'GET',
            'callback' => [$this, 'get_current_user'],
            'permission_callback' => function ($request) {
                $nonce = $request->get_header('X-WP-Nonce');
                return is_user_logged_in() && wp_verify_nonce($nonce, 'wp_rest');
            },
        ]);

        // Route for updating profile
        register_rest_route('home-portal/v1', '/update-profile', [
            'methods' => 'POST',
            'callback' => [$this, 'update_profile'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);
    }

    public function get_current_user() {
        $current_user = wp_get_current_user();

        if (!$current_user || $current_user->ID === 0) {
            return [
                'success' => false,
                'message' => 'User not logged in.',
            ];
        }

        // Determine role
        $role = in_array('local_provider', (array)$current_user->roles)
            ? 'local_provider'
            : (in_array('home_member', (array)$current_user->roles)
                ? 'home_member'
                : implode(',', $current_user->roles));

        // Meta fields
        $meta = [
            'companyName'   => get_user_meta($current_user->ID, 'company_name', true),
            'streetAddress' => get_user_meta($current_user->ID, 'street_address', true),
            'zipCode'       => get_user_meta($current_user->ID, 'zip_code', true),
            'city'          => get_user_meta($current_user->ID, 'city', true),
            'state'         => get_user_meta($current_user->ID, 'state', true),
        ];

        // Avatar handling
        $avatar = get_user_meta($current_user->ID, 'avatar', true);
        $use_ui_avatar = false;

        if (empty($avatar)) {
            $avatar = get_avatar_url($current_user->ID);

            // Check if Gravatar returns default "mystery man"
            if (strpos($avatar, 'd=mm') !== false) {
                $use_ui_avatar = true;
            }
        }

        if ($use_ui_avatar) {
            $first = $current_user->first_name ?: '';
            $last  = $current_user->last_name ?: '';
            $name  = trim($first . ' ' . $last);
            if (empty($name)) $name = $current_user->user_login;

            $avatar = "https://ui-avatars.com/api/?name=" . urlencode($name) . "&background=0D8ABC&color=fff";
        }


        return [
            'success' => true,
            'user' => [
                'ID'            => $current_user->ID,
                'username'      => $current_user->user_login,
                'email'         => $current_user->user_email,
                'firstName'     => $current_user->first_name,
                'lastName'      => $current_user->last_name,
                'role'          => $role,
                'avatar'        => esc_url_raw($avatar),
                'companyName'   => $meta['companyName'],
                'streetAddress' => $meta['streetAddress'],
                'zipCode'       => $meta['zipCode'],
                'city'          => $meta['city'],
                'state'         => $meta['state'],
            ],
        ];
    }

    public function update_profile($request) {
        $user_id = get_current_user_id();
        if (!$user_id) {
            return ['success' => false, 'message' => 'User not logged in'];
        }

        $data = $request->get_json_params();
        if (empty($data)) $data = $request->get_params();

        // Update basic info
        wp_update_user([
            'ID'         => $user_id,
            'first_name' => sanitize_text_field($data['firstName'] ?? ''),
            'last_name'  => sanitize_text_field($data['lastName'] ?? ''),
            'user_email' => !empty($data['email']) ? sanitize_email($data['email']) : get_userdata($user_id)->user_email,
        ]);

        // Update meta fields
        $meta_map = [
            'companyName'   => 'company_name',
            'streetAddress' => 'street_address',
            'zipCode'       => 'zip_code',
            'city'          => 'city',
            'state'         => 'state',
        ];

        foreach ($meta_map as $form_key => $meta_key) {
            if (isset($data[$form_key])) {
                update_user_meta($user_id, $meta_key, sanitize_text_field($data[$form_key]));
            }
        }

        // Handle avatar upload
        if (!empty($_FILES['file']['tmp_name'])) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            $upload = wp_handle_upload($_FILES['file'], ['test_form' => false]);
            if (empty($upload['error']) && !empty($upload['url'])) {
                $avatar_url = trim(str_replace('\\', '', esc_url_raw($upload['url'])));
                update_user_meta($user_id, 'avatar', $avatar_url);
            }
        }

        // Return updated data
        return $this->get_current_user();
    }
}
