<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class ServiceHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('init', [$this, 'register_service_category_taxonomy']);
    }

    public function register_routes() {
        register_rest_route('home-portal/v1', '/create-service', [
            'methods'  => 'POST',
            'callback' => [$this, 'create_service'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('home-portal/v1', '/get-services', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_services'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('home-portal/v1', '/delete-service/(?P<id>\d+)', [
            'methods'  => 'DELETE',
            'callback' => [$this, 'delete_service'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('home-portal/v1', '/providers', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_providers'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function register_service_category_taxonomy() {
        register_taxonomy('service_category', 'vendor_service', [
            'label'             => 'Service Categories',
            'hierarchical'      => false,
            'show_ui'           => true,
            'show_admin_column' => true,
            'show_in_rest'      => true,
        ]);

        $default_categories = [
            'House washing',
            'Roof soft wash',
            'Driveway sealing / patio cleaning',
            'Window cleaning',
            'Gutter cleaning',
            'HVAC services',
            'Pool care',
            'Pressure washing',
            'Landscaping',
            'Pest control',
            'Others',
        ];

        foreach ($default_categories as $category) {
            if (!term_exists($category, 'service_category')) {
                wp_insert_term($category, 'service_category');
            }
        }
    }

    public function create_service($request) {
        $params = json_decode($request->get_body(), true);
        $current_user = wp_get_current_user();

        if (!$current_user->ID) {
            return new \WP_Error('unauthorized', 'User not logged in.', ['status' => 401]);
        }

        $id          = intval($params['id'] ?? 0);
        $name        = sanitize_text_field($params['name'] ?? '');
        $description = sanitize_textarea_field($params['description'] ?? '');
        $price       = isset($params['price']) ? floatval($params['price']) : 0;
        $important   = sanitize_textarea_field($params['importantNotes'] ?? '');
        $status      = sanitize_text_field($params['status'] ?? '');
        $category    = sanitize_text_field($params['category'] ?? '');

        // 🟢 Update if service belongs to current user
        if ($id && get_post_field('post_author', $id) == $current_user->ID) {
            $post_id = wp_update_post([
                'ID'           => $id,
                'post_title'   => $name,
                'post_content' => $description,
                'post_status' => ($status === 'Inactive') ? 'draft' : 'publish',
            ], true);

            if (is_wp_error($post_id)) {
                return new \WP_Error('update_failed', $post_id->get_error_message(), ['status' => 500]);
            }

            update_post_meta($post_id, 'price', $price);
            update_post_meta($post_id, 'important_notes', $important);
            update_post_meta($post_id, 'status', $status ?: 'Inactive');

            if (!empty($category)) {
                wp_set_object_terms($post_id, $category, 'service_category', false);
            }

            return [
                'success' => true,
                'message' => 'Service updated successfully.',
                'id'      => $post_id,
                'action'  => 'updated',
            ];
        }

        // 🟢 Otherwise, create a new one
        $post_id = wp_insert_post([
            'post_type'    => 'vendor_service',
            'post_title'   => $name,
            'post_content' => $description,
            'post_status'  => 'publish',
            'post_author'  => $current_user->ID,
        ]);

        if (is_wp_error($post_id)) {
            return new \WP_Error('insert_failed', $post_id->get_error_message(), ['status' => 500]);
        }

        update_post_meta($post_id, 'price', $price);
        update_post_meta($post_id, 'important_notes', $important);
        update_post_meta($post_id, 'status', 'Active');

        if (!empty($category)) {
            wp_set_object_terms($post_id, $category, 'service_category', false);
        }

        return [
            'success' => true,
            'message' => 'Service created successfully.',
            'id'      => $post_id,
            'action'  => 'created',
        ];
    }

    public function get_services($request) {
        $current_user = wp_get_current_user();

        // 🧩 Strict: Require login to view any services
        if (!$current_user || !$current_user->ID) {
            return new \WP_Error('unauthorized', 'User not logged in.', ['status' => 401]);
        }

        // 🧩 Only fetch logged-in user's services
        $args = [
            'post_type'      => 'vendor_service',
            'posts_per_page' => -1,
            'post_status'    => ['publish', 'draft'],
            'author'         => $current_user->ID,
        ];

        $query = new \WP_Query($args);
        $services = [];

        foreach ($query->posts as $post) {
            $category = wp_get_post_terms($post->ID, 'service_category', ['fields' => 'names']);
            $services[] = [
                'id'             => $post->ID,
                'name'           => $post->post_title,
                'description'    => $post->post_content,
                'category'       => $category[0] ?? '',
                'price'          => get_post_meta($post->ID, 'price', true),
                'importantNotes' => get_post_meta($post->ID, 'important_notes', true),
                'status'         => get_post_meta($post->ID, 'status', true) ?: 'Inactive',
                'author'         => get_the_author_meta('user_login', $post->post_author),
            ];
        }

        return [
            'success' => true,
            'data'    => $services,
            'count'   => count($services),
        ];
    }

    public function delete_service($request) {
        $current_user = wp_get_current_user();
        $id = intval($request['id']);

        if (!$current_user->ID) {
            return new \WP_Error('unauthorized', 'User not logged in.', ['status' => 401]);
        }

        $post = get_post($id);
        if (!$post || $post->post_type !== 'vendor_service') {
            return new \WP_Error('not_found', 'Service not found.', ['status' => 404]);
        }

        if ($post->post_author != $current_user->ID) {
            return new \WP_Error('forbidden', 'You are not allowed to delete this service.', ['status' => 403]);
        }

        $deleted = wp_delete_post($id, true);
        if (!$deleted) {
            return new \WP_Error('delete_failed', 'Failed to delete service.', ['status' => 500]);
        }

        return [
            'success' => true,
            'message' => 'Service deleted successfully.',
            'id'      => $id,
        ];
    }

    public function get_providers() {
        // Get all local_provider users
        $args = [
            'role' => 'local_provider',
            'number' => -1,
        ];
        $users = get_users($args);
        $providers = [];

        foreach ($users as $user) {
            // Fetch vendor_service posts by this provider
            $services = get_posts([
                'post_type'   => 'vendor_service',
                'post_status' => 'publish',
                'author'      => $user->ID,
                'numberposts' => -1,
            ]);

            $providers[] = [
                'id'       => $user->ID,
                'name'     => $user->display_name,
                'email'    => $user->user_email,
                'services' => array_map(function ($service) {
                    return [
                        'title'            => get_the_title($service),
                        'description'      => get_the_excerpt($service),
                        'price'            => get_post_meta($service->ID, 'price', true),
                        'important_notes'  => get_post_meta($service->ID, 'important_notes', true),
                        'status'           => get_post_meta($service->ID, 'status', true),
                    ];
                }, $services),
            ];
        }

        return rest_ensure_response($providers);
    }
}
