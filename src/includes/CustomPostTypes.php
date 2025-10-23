<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class CustomPostTypes {

    public function __construct() {
        add_action('init', [$this, 'register_services_cpt']);
        add_action('init', [$this, 'register_requests_cpt']);
        add_action('init', [$this, 'register_request_category_taxonomy']);
    }

    /**
     * Register the Services CPT
     */
    public function register_services_cpt() {
        $labels = [
            'name' => 'Services',
            'singular_name' => 'Service',
            'add_new_item' => 'Add New Service',
            'edit_item' => 'Edit Service',
            'all_items' => 'All Services',
            'menu_name' => 'Services',
        ];

        $args = [
            'label' => 'Services',
            'labels' => $labels,
            'public' => false,
            'show_ui' => true,
            'supports' => ['title', 'editor'],
            'capability_type' => 'post',
            'map_meta_cap' => true,
            'menu_icon' => 'dashicons-hammer',
        ];

        register_post_type('vendor_service', $args);
    }

    /**
     * Register the Vendor Requests CPT
     */
    public function register_requests_cpt() {
        $labels = [
            'name' => 'Service Requests',
            'singular_name' => 'Service Request',
            'add_new_item' => 'Add New Request',
            'edit_item' => 'Edit Request',
            'all_items' => 'All Requests',
            'menu_name' => 'Service Requests',
        ];

        $args = [
            'label' => 'Service Requests',
            'labels' => $labels,
            'public' => false,
            'show_ui' => true,
            'supports' => ['title', 'editor'],
            'capability_type' => 'post',
            'map_meta_cap' => true,
            'menu_icon' => 'dashicons-email',
        ];

        register_post_type('vendor_request', $args);
    }

    /**
     * Register Request Category Taxonomy
     */
    public function register_request_category_taxonomy() {
        register_taxonomy('request_category', 'vendor_request', [
            'label' => 'Request Categories',
            'rewrite' => ['slug' => 'request-category'],
            'hierarchical' => true,
            'show_admin_column' => true,
        ]);
    }
}
