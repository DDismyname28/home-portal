<?php

namespace HiiincHomePortalApp\Includes;

class CustomPostTypes {

    public function __construct() {
        add_action('init', [$this, 'register_services_cpt']);
        add_action('init', [$this, 'register_service_requests_cpt']);
    }

    /**
     * Register the Services CPT
     * Providers add/edit services they offer
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
            'public' => false, // not public
            'show_ui' => true, // visible in admin dashboard
            'supports' => ['title', 'editor'],
            'capability_type' => 'post',
            'map_meta_cap' => true,
            'menu_icon' => 'dashicons-hammer',
        ];

        register_post_type('vendor_service', $args);
    }

    /**
     * Register the Service Requests CPT
     * Members send requests to providers for their services
     */
    public function register_service_requests_cpt() {
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

        register_post_type('service_request', $args);
    }
}
