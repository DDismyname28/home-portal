<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class RequestHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('init', [$this, 'register_request_category_taxonomy']);
        add_action('init', [$this, 'register_vendor_request_cpt']);
    }

    /**
     * Register REST routes
     */
    public function register_routes() {
        register_rest_route('home-portal/v1', '/get-requests', [
            'methods' => 'GET',
            'callback' => [$this, 'get_requests'],
            'permission_callback' => [$this, 'check_user_permission']
        ]);

        register_rest_route('home-portal/v1', '/create-request', [
            'methods' => 'POST',
            'callback' => [$this, 'save_request'],
            'permission_callback' => [$this, 'check_user_permission']
        ]);

        register_rest_route('home-portal/v1', '/delete-request/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete_request'],
            'permission_callback' => [$this, 'check_user_permission']
        ]);

        register_rest_route('home-portal/v1', '/get-vendors-by-category', [
            'methods' => 'GET',
            'callback' => [$this, 'get_vendors_by_category'],
            'permission_callback' => [$this, 'check_user_permission']
        ]);
    }

    /**
     * Allow both home members and local providers
     */
    public function check_user_permission() {
        return is_user_logged_in() && (current_user_can('home_member') || current_user_can('local_provider'));
    }

    /**
     * Register custom post type for requests
     */
    public function register_vendor_request_cpt() {
        register_post_type('vendor_request', [
            'label' => 'Service Requests',
            'public' => false,
            'show_ui' => true,
            'supports' => ['title', 'author'],
            'capability_type' => 'post',
        ]);
    }

    /**
     * Register taxonomy for request categories
     */
    public function register_request_category_taxonomy() {
        register_taxonomy('request_category', 'vendor_request', [
            'label' => 'Request Categories',
            'rewrite' => ['slug' => 'request-category'],
            'hierarchical' => true,
            'show_admin_column' => true,
        ]);
    }

    /**
     * Get all requests for logged-in user
     */
    public function get_requests() {
        $user_id = get_current_user_id();
        $args = [
            'post_type' => 'vendor_request',
            'author' => $user_id,
            'post_status' => ['publish', 'draft'],
            'posts_per_page' => -1,
        ];

        $query = new \WP_Query($args);
        $requests = [];

        foreach ($query->posts as $post) {
            $categories = wp_get_post_terms($post->ID, 'request_category', ['fields' => 'names']);
            $photos = get_post_meta($post->ID, 'photos', true);
            $photos = is_array($photos) ? $photos : [];

            $requests[] = [
                'id' => $post->ID,
                'category' => implode(', ', $categories),
                'provider' => get_post_meta($post->ID, 'provider', true),
                'description' => get_post_meta($post->ID, 'description', true),
                'date' => get_post_meta($post->ID, 'schedule_date', true),
                'timePreference' => get_post_meta($post->ID, 'schedule_period', true),
                'status' => get_post_meta($post->ID, 'status', true) ?: 'Pending',
                'photos' => array_map('wp_get_attachment_url', $photos),
            ];
        }

        return rest_ensure_response(['success' => true, 'data' => $requests]);
    }

    /**
     * Create or update a service request
     */
    public function save_request($request) {
        $user_id = get_current_user_id();

        $id = $request->get_param('id');
        $is_update = !empty($id);

        $post_data = [
            'post_type' => 'vendor_request',
            'post_status' => 'publish',
            'post_author' => $user_id,
        ];

        if ($is_update) {
            $post_data['ID'] = intval($id);
        }

        $category = sanitize_text_field($request->get_param('category'));
        $provider = sanitize_text_field($request->get_param('provider'));
        $description = sanitize_textarea_field($request->get_param('description'));
        $date = sanitize_text_field($request->get_param('date'));
        $timePreference = sanitize_text_field($request->get_param('timePreference'));
        $status = sanitize_text_field($request->get_param('status')) ?: 'Pending';

        // Insert or update post
        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            return rest_ensure_response(['success' => false, 'message' => 'Failed to save request.']);
        }

        // Assign taxonomy
        if ($category) {
            wp_set_object_terms($post_id, $category, 'request_category');
        }

        // Save meta
        update_post_meta($post_id, 'provider', $provider);
        update_post_meta($post_id, 'description', $description);
        update_post_meta($post_id, 'schedule_date', $date);
        update_post_meta($post_id, 'schedule_period', $timePreference);
        update_post_meta($post_id, 'status', $status);

        // Handle photo uploads (if any)
        $photo_ids = [];
        if (!empty($_FILES['photos'])) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';

            foreach ($_FILES['photos']['name'] as $key => $name) {
                $file = [
                    'name' => $name,
                    'type' => $_FILES['photos']['type'][$key],
                    'tmp_name' => $_FILES['photos']['tmp_name'][$key],
                    'error' => $_FILES['photos']['error'][$key],
                    'size' => $_FILES['photos']['size'][$key],
                ];
                $attach_id = media_handle_sideload($file, $post_id);
                if (!is_wp_error($attach_id)) {
                    $photo_ids[] = $attach_id;
                }
            }

            if (!empty($photo_ids)) {
                update_post_meta($post_id, 'photos', $photo_ids);
            }
        }

        // Send email notification to admin (only for new requests)
        if (!$is_update) {
            $admin_email = get_option('admin_email');
            $user = wp_get_current_user();
            $user_name = $user->display_name;
            $user_email = $user->user_email;

            $subject = 'New Service Request Submitted';

            $message = "A new service request has been submitted:\n\n";
            $message .= "Submitted by: $user_name <$user_email>\n"; // Added user info
            $message .= "Category: $category\n";
            $message .= "Date: $date\n";
            $message .= "Time: $timePreference\n";
            $message .= "Description: $description\n";
            $message .= "View in admin: " . get_edit_post_link($post_id) . "\n";

            // Convert photo IDs to file paths for attachment
            $attachments = [];
            foreach ($photo_ids as $pid) {
                $file_path = get_attached_file($pid);
                if (file_exists($file_path)) {
                    $attachments[] = $file_path;
                }
            }

            wp_mail($admin_email, $subject, $message, '', $attachments);
        }

        return rest_ensure_response(['success' => true, 'id' => $post_id]);
    }

    /**
     * Delete a service request
     */
    public function delete_request($request) {
        $id = intval($request->get_param('id'));

        if (get_post_field('post_author', $id) != get_current_user_id()) {
            return rest_ensure_response(['success' => false, 'message' => 'Permission denied.']);
        }

        $deleted = wp_delete_post($id, true);

        return rest_ensure_response(['success' => (bool) $deleted]);
    }

    /**
     * Return list of vendors matching selected category
     */
    public function get_vendors_by_category($request) {
        $category = sanitize_text_field($request->get_param('category'));

        if (empty($category)) {
            return rest_ensure_response([
                'success' => false,
                'data' => [],
                'message' => 'Missing category.'
            ]);
        }

        $term = get_term_by('name', $category, 'service_category');
        if (!$term) {
            return rest_ensure_response([
                'success' => false,
                'data' => [],
                'message' => 'Category not found.'
            ]);
        }

        $query = new \WP_Query([
            'post_type' => 'vendor_service',
            'tax_query' => [
                [
                    'taxonomy' => 'service_category',
                    'field' => 'term_id',
                    'terms' => $term->term_id,
                ],
            ],
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'fields' => 'ids',
        ]);

        $vendor_ids = [];

        foreach ($query->posts as $post_id) {
            $author_id = get_post_field('post_author', $post_id);
            if ($author_id && !in_array($author_id, $vendor_ids)) {
                $vendor_ids[] = $author_id;
            }
        }

        $vendors = [];
        foreach ($vendor_ids as $uid) {
            $user = get_userdata($uid);
            if ($user && in_array('local_provider', $user->roles)) {
                $vendors[] = [
                    'id' => $user->ID,
                    'name' => $user->display_name,
                    'email' => $user->user_email,
                ];
            }
        }

        return rest_ensure_response([
            'success' => true,
            'data' => $vendors,
        ]);
    }
}
