<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class Assets {

    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'maybe_enqueue_assets']);
        add_filter('template_include', [$this, 'pick_dashboard_template'], 20);
    }

    public function maybe_enqueue_assets() {
        global $post;

        // --- Detect if we're on the signup shortcode page ---
        $has_signup_shortcode = (
            is_singular() &&
            isset($post->post_content) &&
            has_shortcode($post->post_content, 'react_signup_form')
        );

        // --- Detect if we're on the dashboard page ---
        $dashboard_id = Dashboard::get_page_id();
        $is_dashboard_page = ($dashboard_id && is_page($dashboard_id));

        // If neither condition is true, stop here
        if (!$has_signup_shortcode && !$is_dashboard_page) {
            return;
        }

        // --- Set paths and URLs ---
        $plugin_root_path = plugin_dir_path(dirname(__DIR__, 1)); // plugin base dir
        $plugin_root_url  = plugin_dir_url($plugin_root_path . 'home-portal.php');

        $script_rel = 'src/assets/js/script.js';
        $css_rel    = 'src/assets/css/main.css';

        $script_path = $plugin_root_path . $script_rel;
        $css_path    = $plugin_root_path . $css_rel;

        $script_url = $plugin_root_url . $script_rel;
        $css_url    = $plugin_root_url . $css_rel;

        // --- Enqueue CSS ---
        if (file_exists($css_path)) {
            wp_enqueue_style(
                'hiiinc-home-style',
                $css_url,
                [],
                filemtime($css_path)
            );
        }

        // --- Enqueue JS ---
        if (file_exists($script_path)) {
            wp_enqueue_script(
                'hiiinc-home-app',
                $script_url,
                ['jquery'],
                filemtime($script_path),
                true
            );

            wp_localize_script('hiiinc-home-app', 'HiiincHomeDashboardData', [
                'apiRoot' => esc_url_raw(rest_url('home-portal/v1/')),
                'nonce'   => wp_create_nonce('wp_rest'),
                'page_id' => $dashboard_id,
                'isDashboard' => $is_dashboard_page,
                'isSignupPage' => $has_signup_shortcode,
            ]);
        }
    }

    public function pick_dashboard_template($template) {
        $dashboard_id = Dashboard::get_page_id();
        if ($dashboard_id && is_page($dashboard_id)) {
            return plugin_dir_path(dirname(__DIR__, 1)) . 'src/includes/templates/dashboard-shell.php';
        }
        return $template;
    }
}
