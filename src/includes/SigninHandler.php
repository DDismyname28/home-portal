<?php

namespace HiiincHomePortalApp\Includes;

class SigninHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('home-portal/v1', '/signin', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_signin'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function handle_signin($request) {
        $data = $request->get_json_params();
        $login = sanitize_text_field($data['login'] ?? '');
        $password = $data['password'] ?? '';

        $user = wp_authenticate($login, $password);

        if (is_wp_error($user)) {
            return [
                'success' => false,
                'message' => $user->get_error_message(),
            ];
        }

        // Login the user
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, true);

        // Redirect URL to dashboard
        $dashboard_id = \HiiincHomePortalApp\Includes\Dashboard::get_page_id();
        $redirect_url = $dashboard_id ? get_permalink($dashboard_id) : site_url('/');

        return [
            'success' => true,
            'message' => 'Logged in successfully!',
            'redirect_url' => $redirect_url,
        ];
    }
}
