<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class SignupHandler {

    public function __construct() {
        add_shortcode('vendor_register', [$this, 'render_signup_form']);
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('home-portal/v1', '/signup', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_signup'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function render_signup_form() {
        return '<div id="react-signup-root"></div>';
    }

    public function handle_signup($request) {
        $data = $request->get_json_params();

        $username    = sanitize_user($data['username'] ?? '');
        $email       = sanitize_email($data['email'] ?? '');
        $membership  = $data['membershipType'] ?? 'regular'; // 'regular' or 'provider'
        $firstName   = sanitize_text_field($data['firstName'] ?? '');
        $lastName    = sanitize_text_field($data['lastName'] ?? '');
        $companyName = sanitize_text_field($data['companyName'] ?? '');
        $street      = sanitize_text_field($data['streetAddress'] ?? '');
        $zip         = sanitize_text_field($data['zipCode'] ?? '');
        $city        = sanitize_text_field($data['city'] ?? '');
        $state       = sanitize_text_field($data['state'] ?? '');

        // Map frontend membership to WP roles
        $role = ($membership === 'provider') ? 'local_provider' : 'home_member';

        // Ensure role exists
        if (!function_exists('get_editable_roles')) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }
        if (!array_key_exists($role, get_editable_roles())) {
            $role = 'subscriber';
        }

        if (username_exists($username) || email_exists($email)) {
            return ['success' => false, 'message' => 'Username or email already exists'];
        }

        // Create user
        $password = wp_generate_password(12, false);
        $user_id  = wp_create_user($username, $password, $email);

        if (is_wp_error($user_id)) {
            return ['success' => false, 'message' => $user_id->get_error_message()];
        }

        // Assign correct role
        $user = new \WP_User($user_id);
        $user->set_role($role);

        // Update name
        wp_update_user([
            'ID'         => $user_id,
            'first_name' => $firstName,
            'last_name'  => $lastName,
        ]);

        // Save meta
        if ($role === 'local_provider' && $companyName) {
            update_user_meta($user_id, 'companyName', $companyName);
        }
        update_user_meta($user_id, 'streetAddress', $street);
        update_user_meta($user_id, 'zipCode', $zip);
        update_user_meta($user_id, 'city', $city);
        update_user_meta($user_id, 'state', $state);

        // Send password reset link
        $reset_key = get_password_reset_key(get_userdata($user_id));
        if (!is_wp_error($reset_key)) {
            $reset_url = network_site_url("wp-login.php?action=rp&key={$reset_key}&login=" . rawurlencode($username), 'login');
            $message   = "Hi {$firstName},\n\nYour account has been created. Click here to set your password:\n$reset_url\n\nThank you!";
            wp_mail($email, 'Set Your Home Portal Password', $message);
        }

        return [
            'success' => true,
            'message' => 'Account created successfully! Check your email to set your password.'
        ];
    }
}
