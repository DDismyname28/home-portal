<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class CurrentUserHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('home-portal/v1', '/me', [
            'methods' => 'GET',
            'callback' => [$this, 'get_current_user'],
            'permission_callback' => function ($request) {
                $nonce = $request->get_header('X-WP-Nonce');
                return is_user_logged_in() && wp_verify_nonce($nonce, 'wp_rest');
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

        $role = in_array('local_provider', (array)$current_user->roles) ? 'local_provider' : 'home_member';

        return [
            'success' => true,
            'user' => [
                'ID'        => $current_user->ID,
                'username'  => $current_user->user_login,
                'email'     => $current_user->user_email,
                'firstName' => $current_user->first_name,
                'lastName'  => $current_user->last_name,
                'role'      => $role,
                'avatar'    => get_avatar_url($current_user->ID),
                'meta'      => [
                    'company_name'   => get_user_meta($current_user->ID, 'company_name', true),
                    'street_address' => get_user_meta($current_user->ID, 'street_address', true),
                    'zip_code'       => get_user_meta($current_user->ID, 'zip_code', true),
                    'city'           => get_user_meta($current_user->ID, 'city', true),
                    'state'          => get_user_meta($current_user->ID, 'state', true),
                ],
            ],
        ];
    }
}
