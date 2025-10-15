<?php

namespace HiiincHomePortalApp;

use HiiincHomePortalApp\Includes\Assets;
use HiiincHomePortalApp\Includes\RegisterRoles;
use HiiincHomePortalApp\Includes\Shortcodes;
use HiiincHomePortalApp\Includes\DashboardAssets;

class Loader {

    public function __construct() {
        new Assets();
        new RegisterRoles();
        new Shortcodes();
        new DashboardAssets();
    }
}
