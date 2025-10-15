<?php

namespace HiiincHomePortalApp\Includes;

class RegisterRoles {

    // If you need to modify roles dynamically or check them each request
    public function __construct() {
    }
    // Called once on plugin activation
    public static function activate() {
        add_role('home_member', 'Home Member', ['read' => true]);
        add_role('local_provider', 'Local Provider', ['read' => true]);
    }

    // Called once on plugin deactivation
    public static function deactivate() {
        remove_role('home_member');
        remove_role('local_provider');
    }

    // Called every page load (if needed)

}
