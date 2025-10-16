<?php

namespace HiiincHomePortalApp\Includes;

class Assets {

    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'enqueue_front_assets']);
    }

    public function enqueue_front_assets() {
        $plugin_dir = dirname(dirname(__FILE__));
        $plugin_url = plugin_dir_url(dirname(__DIR__));

        $css_path = $plugin_dir . '/assets/css/main.css';
        $css_url  = $plugin_url . 'src/assets/css/main.css';

        $js_path = $plugin_dir . '/assets/js/script.js';
        $js_url  = $plugin_url . 'src/assets/js/script.js';

        if (file_exists($css_path)) {
            wp_enqueue_style('home-portal-main-style', $css_url, [], filemtime($css_path));
        }

        if (file_exists($js_path)) {
            wp_enqueue_script('home-portal-main-script', $js_url, ['jquery'], filemtime($js_path), true);
        }
    }
}
