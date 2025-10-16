<?php

namespace HiiincHomePortalApp\Includes;

class ProfileHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('home-portal/v1', '/update-profile', [
            'methods' => 'POST',
            'callback' => [$this, 'update_profile'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);
    }

    public function update_profile($request) {
        $user_id = get_current_user_id();
        $data = $request->get_json_params();

        if (!$user_id) {
            return [
                'success' => false,
                'message' => 'User not logged in'
            ];
        }

        // Update standard WP fields
        if (!empty($data['name'])) {
            $name_parts = explode(' ', $data['name'], 2);
            wp_update_user([
                'ID' => $user_id,
                'first_name' => $name_parts[0],
                'last_name' => $name_parts[1] ?? ''
            ]);
        }

        if (!empty($data['username'])) {
            wp_update_user([
                'ID' => $user_id,
                'user_login' => sanitize_user($data['username'])
            ]);
        }

        if (!empty($data['email'])) {
            wp_update_user([
                'ID' => $user_id,
                'user_email' => sanitize_email($data['email'])
            ]);
        }

        // Update meta fields
        $meta_fields = ['street', 'zipcode', 'city', 'state', 'avatar'];
        foreach ($meta_fields as $field) {
            if (isset($data[$field])) {
                update_user_meta($user_id, $field, sanitize_text_field($data[$field]));
            }
        }

        return [
            'success' => true,
            'message' => 'Profile updated successfully'
        ];
    }
}
