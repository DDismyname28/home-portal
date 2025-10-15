<?php

namespace HiiincHomePortalApp;

use HiiincHomePortalApp\Includes\Assets;
use HiiincHomePortalApp\Includes\RegisterRoles;
use HiiincHomePortalApp\Includes\Shortcodes;
use HiiincHomePortalApp\Includes\DashboardAssets;
use HiiincHomePortalApp\Includes\SignupHandler;
use HiiincHomePortalApp\Includes\SigninHandler;

class Loader {
    public function __construct() {
        new Assets();
        new RegisterRoles();
        new Shortcodes();
        new DashboardAssets();
        new SignupHandler();
        new SigninHandler();
    }
}
