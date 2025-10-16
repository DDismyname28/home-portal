<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class DashboardAssets {

    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'maybe_enqueue_assets']);
        add_filter('template_include', [$this, 'pick_template'], 20);
    }

    public function maybe_enqueue_assets() {
        $page_id = Dashboard::get_page_id();
        if (!$page_id || !is_page($page_id)) return;

        $plugin_root_path = plugin_dir_path(dirname(__DIR__, 1));
        $plugin_root_url = plugin_dir_url($plugin_root_path . 'home-portal.php');

        $script_rel = 'src/assets/js/script.js';
        $css_rel    = 'src/assets/css/main.css';

        $script_path = $plugin_root_path . $script_rel;
        $css_path    = $plugin_root_path . $css_rel;

        $script_url = $plugin_root_url . $script_rel;
        $css_url    = $plugin_root_url . $css_rel;

        if (file_exists($css_path)) {
            wp_enqueue_style(
                'hiiinc-home-dashboard-style',
                $css_url,
                [],
                filemtime($css_path)
            );
        }

        if (file_exists($script_path)) {
            wp_enqueue_script(
                'hiiinc-home-dashboard-app',
                $script_url,
                [],
                filemtime($script_path),
                true
            );

            wp_localize_script('hiiinc-home-dashboard-app', 'HiiincHomeDashboardData', [
                'apiRoot' => esc_url_raw(rest_url('home-portal/v1/')),
                'nonce'   => wp_create_nonce('wp_rest'),
                'page_id' => $page_id,
            ]);
        }
    }

    public function pick_template($template) {
        $page_id = Dashboard::get_page_id();
        if ($page_id && is_page($page_id)) {
            return plugin_dir_path(dirname(__DIR__, 1)) . 'src/includes/templates/dashboard-shell.php';
        }
        return $template;
    }
}
