<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class RegisterRoles {

    public function __construct() {
        // optional code on every page load
    }

    public static function activate() {
        add_role('home_member', 'Home Member', ['read' => true]);
        add_role('local_provider', 'Local Provider', ['read' => true]);
    }

    public static function deactivate() {
        remove_role('home_member');
        remove_role('local_provider');
    }
}
