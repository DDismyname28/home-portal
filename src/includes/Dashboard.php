<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class Dashboard {
    const OPTION_KEY = 'hiiinc_dashboard_page_id';
    const SLUG = 'vendor-dashboard';
    const TITLE = 'Vendor Dashboard';

    public static function activate() {
        // if page exists by slug, store and return
        $page = get_page_by_path(self::SLUG);
        if ($page) {
            update_option(self::OPTION_KEY, $page->ID);
            return;
        }

        $post_id = wp_insert_post([
            'post_title'   => self::TITLE,
            'post_name'    => self::SLUG,
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_author'  => get_current_user_id() ?: 1,
        ]);

        if (!is_wp_error($post_id) && $post_id) {
            update_option(self::OPTION_KEY, (int)$post_id);
        }
    }

    public static function deactivate() {
        $page_id = get_option(self::OPTION_KEY);
        if ($page_id) {
            wp_delete_post((int)$page_id, true); // hard-delete
            delete_option(self::OPTION_KEY);
        }
    }

    public static function get_page_id(): int {
        return (int) get_option(self::OPTION_KEY, 0);
    }
}
