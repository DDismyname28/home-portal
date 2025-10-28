<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class RequestHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
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

        register_rest_route('home-portal/v1', '/get-vendor-requests', [
            'methods' => 'GET',
            'callback' => [$this, 'get_vendor_requests'],
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
            'post_type'   => 'vendor_request',
            'post_status' => 'publish',
            'post_author' => $user_id,
        ];

        if ($is_update) {
            $post_data['ID'] = intval($id);
        }

        $category       = sanitize_text_field($request->get_param('category'));
        $provider       = sanitize_text_field($request->get_param('provider'));
        $description    = sanitize_textarea_field($request->get_param('description'));
        $date           = sanitize_text_field($request->get_param('date'));
        $timePreference = sanitize_text_field($request->get_param('timePreference'));
        $status         = sanitize_text_field($request->get_param('status')) ?: 'Pending';

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

        // --- Handle multiple photo uploads ---
        $photo_ids = [];
        if (!empty($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';

            foreach ($_FILES['photos']['name'] as $i => $name) {
                if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) {
                    continue; // skip invalid uploads
                }

                $file = [
                    'name'     => sanitize_file_name($name),
                    'type'     => $_FILES['photos']['type'][$i],
                    'tmp_name' => $_FILES['photos']['tmp_name'][$i],
                    'error'    => $_FILES['photos']['error'][$i],
                    'size'     => $_FILES['photos']['size'][$i],
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

        // --- Email notifications (Admin + Provider) ---
        if (!$is_update) {
            $admin_email = get_option('admin_email');
            $user        = wp_get_current_user();
            $user_name   = $user->display_name;
            $user_email  = $user->user_email;

            $subject = sprintf('New Service Request from %s', $user_name);

            // Build HTML email
            $message  = '<h2>New Service Request Submitted</h2>';
            $message .= '<p><strong>Submitted by:</strong> ' . esc_html($user_name) . ' (' . esc_html($user_email) . ')</p>';
            $message .= '<p><strong>Category:</strong> ' . esc_html($category) . '</p>';
            $message .= '<p><strong>Date:</strong> ' . esc_html($date) . '</p>';
            $message .= '<p><strong>Time:</strong> ' . esc_html($timePreference) . '</p>';
            $message .= '<p><strong>Description:</strong><br>' . nl2br(esc_html($description)) . '</p>';
            $message .= '<p><a href="' . esc_url(get_edit_post_link($post_id)) . '">View in Admin</a></p>';

            if (!empty($photo_ids)) {
                $message .= '<h3>Attached Photos:</h3>';
                foreach ($photo_ids as $pid) {
                    $url = wp_get_attachment_url($pid);
                    $message .= '<p><img src="' . esc_url($url) . '" alt="" style="max-width:200px;border:1px solid #ccc;margin:5px;"></p>';
                }
            }

            // Get file paths for attachments
            $attachments = [];
            foreach ($photo_ids as $pid) {
                $path = get_attached_file($pid);
                if (file_exists($path)) {
                    $attachments[] = $path;
                }
            }

            // Send email to admin
            add_filter('wp_mail_content_type', fn() => 'text/html');
            wp_mail($admin_email, $subject, $message, [], $attachments);

            // --- Send a separate email to provider ---
            // Lookup provider user info
            $provider_user = get_user_by('login', $provider);
            if (!$provider_user) {
                // Try by ID (if you stored provider as numeric)
                $provider_user = get_user_by('id', intval($provider));
            }

            if ($provider_user && !empty($provider_user->user_email)) {
                $provider_email = $provider_user->user_email;
                $provider_subject = sprintf('You have a new service request from %s', $user_name);

                $provider_message  = '<h2>New Service Request</h2>';
                $provider_message .= '<p><strong>Client:</strong> ' . esc_html($user_name) . ' (' . esc_html($user_email) . ')</p>';
                $provider_message .= '<p><strong>Category:</strong> ' . esc_html($category) . '</p>';
                $provider_message .= '<p><strong>Date:</strong> ' . esc_html($date) . '</p>';
                $provider_message .= '<p><strong>Time:</strong> ' . esc_html($timePreference) . '</p>';
                $provider_message .= '<p><strong>Description:</strong><br>' . nl2br(esc_html($description)) . '</p>';

                if (!empty($photo_ids)) {
                    $provider_message .= '<h3>Attached Photos:</h3>';
                    foreach ($photo_ids as $pid) {
                        $url = wp_get_attachment_url($pid);
                        $provider_message .= '<p><img src="' . esc_url($url) . '" alt="" style="max-width:200px;border:1px solid #ccc;margin:5px;"></p>';
                    }
                }

                wp_mail($provider_email, $provider_subject, $provider_message, [], $attachments);
            }

            remove_filter('wp_mail_content_type', fn() => 'text/html');
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
        ]);

        $services = [];

        foreach ($query->posts as $post) {
            // $post is a WP_Post object or ID depending on WP_Query args.
            $post_id = is_object($post) ? $post->ID : $post;
            $author_id = get_post_field('post_author', $post_id);
            $user = get_userdata($author_id);

            // Only include if provider is a local_provider
            if ($user && in_array('local_provider', (array) $user->roles)) {
                $services[] = [
                    // unique id per service post
                    'service_id' => $post_id,
                    'provider_id' => $user->ID,
                    'provider_name' => $user->display_name,
                    'provider_email' => $user->user_email,
                    'service_title' => get_the_title($post_id),
                    'service_price' => get_post_meta($post_id, 'price', true),
                    'service_description' => wp_strip_all_tags(get_post_field('post_content', $post_id)),
                ];
            }
        }

        return rest_ensure_response([
            'success' => true,
            'data' => $services,
        ]);
    }

    /**
     * Get all vendor requests assigned to the current logged-in provider
     */
    public function get_vendor_requests() {
        $user_id = get_current_user_id();
        $user = get_userdata($user_id);

        if (!$user || !in_array('local_provider', (array) $user->roles)) {
            return rest_ensure_response([
                'success' => false,
                'message' => 'Only local providers can access vendor requests.'
            ]);
        }

        global $wpdb;
        $table_posts = $wpdb->posts;
        $table_meta  = $wpdb->postmeta;

        $results = $wpdb->get_results(
            $wpdb->prepare("
            SELECT p.ID, p.post_author, p.post_date,
                   MAX(CASE WHEN pm.meta_key = 'provider' THEN pm.meta_value END) AS provider,
                   MAX(CASE WHEN pm.meta_key = 'description' THEN pm.meta_value END) AS description,
                   MAX(CASE WHEN pm.meta_key = 'status' THEN pm.meta_value END) AS status
            FROM {$table_posts} AS p
            INNER JOIN {$table_meta} AS pm ON p.ID = pm.post_id
            WHERE p.post_type = 'vendor_request'
              AND p.post_status IN ('publish', 'draft')
              AND p.ID IN (
                  SELECT post_id FROM {$table_meta}
                  WHERE meta_key = 'provider'
                  AND (meta_value = %s OR meta_value = %d)
              )
            GROUP BY p.ID
            ORDER BY p.post_date DESC
        ", $user->user_login, $user_id),
            ARRAY_A
        );

        $data = [];
        foreach ($results as $row) {
            $requester = get_userdata($row['post_author']);
            $categories = wp_get_post_terms($row['ID'], 'request_category', ['fields' => 'names']);

            $data[] = [
                'id'          => intval($row['ID']),
                'requester'   => $requester ? $requester->display_name : 'Unknown',
                'email'       => $requester ? $requester->user_email : '',
                'category'    => implode(', ', $categories) ?: 'N/A',
                'description' => $row['description'] ?: '',
                'status'      => $row['status'] ?: 'Pending',
            ];
        }

        return rest_ensure_response([
            'success' => true,
            'data' => $data
        ]);
    }
}
