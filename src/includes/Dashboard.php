<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class Dashboard {
    const OPTION_KEY = 'hiiinc_dashboard_page_id';
    const SLUG = 'vendor-dashboard';
    const TITLE = 'Vendor Dashboard';
    const SIGNUP_SLUG = 'signup';

    public static function activate() {
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
            wp_delete_post((int)$page_id, true);
            delete_option(self::OPTION_KEY);
        }
    }

    public static function get_page_id(): int {
        return (int) get_option(self::OPTION_KEY, 0);
    }

    public static function restrict_access() {
        $dashboard_id = self::get_page_id();
        if (is_page($dashboard_id) && !is_user_logged_in()) {
            $signup_page = get_page_by_path(self::SIGNUP_SLUG);
            $signup_url = $signup_page ? get_permalink($signup_page->ID) : site_url('/' . self::SIGNUP_SLUG);

            wp_die(
                'You are not authorized to view this page. Please <a href="' . esc_url($signup_url) . '">sign up or log in</a> first.',
                'Unauthorized Access',
                ['response' => 403]
            );
        }
    }
}

add_action('template_redirect', [Dashboard::class, 'restrict_access']);
