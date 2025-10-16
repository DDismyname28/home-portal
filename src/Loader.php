<?php

namespace HiiincHomePortalApp;

use HiiincHomePortalApp\Includes\Assets;
use HiiincHomePortalApp\Includes\CurrentUserHandler;
use HiiincHomePortalApp\Includes\RegisterRoles;
use HiiincHomePortalApp\Includes\Shortcodes;
use HiiincHomePortalApp\Includes\DashboardAssets;
use HiiincHomePortalApp\Includes\SignupHandler;
use HiiincHomePortalApp\Includes\SigninHandler;
use HiiincHomePortalApp\Includes\CustomPostTypes;
use HiiincHomePortalApp\Includes\Dashboard;
use HiiincHomePortalApp\Includes\ProfileHandler;

class Loader {
    public function __construct() {
        new Assets();
        new RegisterRoles();
        new Shortcodes();
        new DashboardAssets();
        new SignupHandler();
        new SigninHandler();
        new CustomPostTypes();
        new Dashboard();
        new CurrentUserHandler();
        new ProfileHandler();
    }
}
