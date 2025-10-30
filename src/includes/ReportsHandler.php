<?php

namespace HiiincHomePortalApp\Includes;

if (! defined('ABSPATH')) exit;

class ReportsHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('home-portal/v1', '/reports', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_report_data'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);
    }

    public function get_report_data($request) {
        $user = wp_get_current_user();
        $user_id = $user->ID;
        $roles = (array) $user->roles;

        if (in_array('home_member', $roles, true)) {
            return $this->get_home_member_report($user_id);
        } elseif (in_array('local_provider', $roles, true)) {
            return $this->get_local_provider_report($user_id);
        } else {
            return rest_ensure_response([
                'success' => false,
                'message' => 'User role not recognized.',
            ]);
        }
    }

    private function get_home_member_report($user_id) {
        global $wpdb;

        $table_posts = $wpdb->posts;
        $table_meta  = $wpdb->postmeta;

        $results = $wpdb->get_results($wpdb->prepare("
        SELECT 
            DATE_FORMAT(p.post_date, '%%Y-%%m') AS month,
            MAX(CASE WHEN pm.meta_key = 'status' THEN pm.meta_value END) AS status
        FROM {$table_posts} AS p
        INNER JOIN {$table_meta} AS pm ON p.ID = pm.post_id
        WHERE p.post_type = 'vendor_request'
          AND p.post_status = 'publish'
          AND p.post_author = %d
        GROUP BY p.ID
    ", $user_id));

        $monthlyData = [];

        foreach ($results as $r) {
            $month = $r->month;
            $status = strtolower(trim($r->status));

            if (!isset($monthlyData[$month])) {
                $monthlyData[$month] = ['Pending' => 0, 'Active' => 0, 'Completed' => 0, 'Total' => 0];
            }

            $monthlyData[$month]['Total']++;
            if ($status === 'pending') $monthlyData[$month]['Pending']++;
            elseif ($status === 'active') $monthlyData[$month]['Active']++;
            elseif ($status === 'completed') $monthlyData[$month]['Completed']++;
        }

        ksort($monthlyData); // sort by month

        return rest_ensure_response([
            'success' => true,
            'role'    => 'home_member',
            'data'    => $monthlyData,
        ]);
    }


    private function get_local_provider_report($user_id) {
        global $wpdb;

        $user = get_userdata($user_id);
        if (!$user || !in_array('local_provider', (array) $user->roles)) {
            return rest_ensure_response(['success' => false, 'message' => 'Only local providers can access this report.']);
        }

        $table_posts = $wpdb->posts;
        $table_meta  = $wpdb->postmeta;

        // Group vendor_request by month
        $requests = $wpdb->get_results($wpdb->prepare("
        SELECT 
            DATE_FORMAT(p.post_date, '%%Y-%%m') AS month,
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
    ", $user->user_login, $user_id));

        $monthlyData = [];

        foreach ($requests as $r) {
            $month = $r->month;
            $status = strtolower(trim($r->status));

            if (!isset($monthlyData[$month])) {
                $monthlyData[$month] = ['Pending' => 0, 'Active' => 0, 'Completed' => 0, 'Total' => 0];
            }

            $monthlyData[$month]['Total']++;
            if ($status === 'pending') $monthlyData[$month]['Pending']++;
            elseif ($status === 'active') $monthlyData[$month]['Active']++;
            elseif ($status === 'completed') $monthlyData[$month]['Completed']++;
        }

        ksort($monthlyData);

        // Count services offered
        $services_count = $wpdb->get_var($wpdb->prepare("
        SELECT COUNT(ID)
        FROM {$table_posts}
        WHERE post_type = 'vendor_service'
          AND post_author = %d
          AND post_status = 'publish'
    ", $user_id));

        return rest_ensure_response([
            'success' => true,
            'role'    => 'local_provider',
            'data'    => [
                'months'           => $monthlyData,
                'services_offered' => intval($services_count),
            ],
        ]);
    }
}
