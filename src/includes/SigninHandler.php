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

        // Optional: return user info
        return [
            'success' => true,
            'user' => [
                'ID' => $user->ID,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'role' => implode(', ', $user->roles),
            ],
        ];
    }
}
