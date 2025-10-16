<?php

namespace HiiincHomePortalApp\Includes;

class SignupHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('home-portal/v1', '/signup', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_signup'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function handle_signup($request) {
        $data = $request->get_json_params();

        $username = sanitize_user($data['username'] ?? '');
        $email = sanitize_email($data['email'] ?? '');
        $first_name = sanitize_text_field($data['firstName'] ?? '');
        $last_name = sanitize_text_field($data['lastName'] ?? '');
        $role = $data['membershipType'] === 'provider' ? 'local_provider' : 'home_member';

        if (username_exists($username) || email_exists($email)) {
            return [
                'success' => false,
                'message' => 'Username or email already exists.'
            ];
        }

        // Generate random password
        $password = wp_generate_password(12, false);
        $user_id = wp_create_user($username, $password, $email);

        if (is_wp_error($user_id)) {
            return [
                'success' => false,
                'message' => $user_id->get_error_message()
            ];
        }

        // Set user meta
        wp_update_user([
            'ID' => $user_id,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'role' => $role
        ]);

        if ($role === 'local_provider') {
            update_user_meta($user_id, 'company_name', sanitize_text_field($data['companyName'] ?? ''));
            update_user_meta($user_id, 'street_address', sanitize_text_field($data['streetAddress'] ?? ''));
            update_user_meta($user_id, 'zip_code', sanitize_text_field($data['zipCode'] ?? ''));
            update_user_meta($user_id, 'city', sanitize_text_field($data['city'] ?? ''));
            update_user_meta($user_id, 'state', sanitize_text_field($data['state'] ?? ''));
        }

        // Send password reset email
        $reset_key = get_password_reset_key(get_userdata($user_id));
        $reset_url = network_site_url("wp-login.php?action=rp&key={$reset_key}&login=" . rawurlencode($username), 'login');

        $message = "Hi {$first_name},\n\n";
        $message .= "Your account has been created. Click the link below to set your password:\n";
        $message .= $reset_url . "\n\n";
        $message .= "Thank you for joining Home Portal!";

        wp_mail($email, 'Set Your Home Portal Password', $message);

        return [
            'success' => true,
            'message' => 'Account created successfully! Please check your email to set your password.',
            // Optional: can auto-login if you skip password reset
            // 'redirect_url' => get_permalink(Dashboard::get_page_id())
        ];
    }
}
