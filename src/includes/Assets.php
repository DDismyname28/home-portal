<?php

namespace HiiincHomePortalApp\Includes;

class Assets {

    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'enqueue_front_assets']);
    }

    public function enqueue_front_assets() {
        // Base paths and URLs relative to plugin root
        $plugin_dir = dirname(dirname(__FILE__)); // points to /src
        $plugin_url = plugin_dir_url(dirname(__DIR__)); // points to /home-portal/

        $css_path = $plugin_dir . '/assets/css/main.css';
        $css_url  = $plugin_url . 'src/assets/css/main.css';

        $js_path = $plugin_dir . '/assets/js/script.js';
        $js_url  = $plugin_url . 'src/assets/js/script.js';

        // Enqueue styles
        if (file_exists($css_path)) {
            wp_enqueue_style(
                'home-portal-main-style',
                $css_url,
                [],
                filemtime($css_path)
            );
        }

        // Enqueue JS
        if (file_exists($js_path)) {
            wp_enqueue_script(
                'home-portal-main-script',
                $js_url,
                ['jquery'],
                filemtime($js_path),
                true
            );
        }
    }
}
