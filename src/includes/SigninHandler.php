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
            $error_code = $user->get_error_code();

            // Generic message to avoid exposing whether username exists
            $message = 'The login credentials you entered are incorrect.';

            // If the issue is wrong password, add a password reset link
            if (in_array($error_code, ['incorrect_password', 'invalid_username'])) {
                $lost_password_url = wp_lostpassword_url();
                $message .= ' <a href="' . esc_url($lost_password_url) . '">Forgot your password?</a>';
            }

            return [
                'success' => false,
                'message' => $message,
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
