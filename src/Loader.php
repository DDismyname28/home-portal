<?php

namespace HiiincHomePortalApp;

use HiiincHomePortalApp\Includes\Assets;
use HiiincHomePortalApp\Includes\Shortcodes;
use HiiincHomePortalApp\Includes\SignupHandler;
use HiiincHomePortalApp\Includes\SigninHandler;
use HiiincHomePortalApp\Includes\CustomPostTypes;
use HiiincHomePortalApp\Includes\Dashboard;
use HiiincHomePortalApp\Includes\ProfileHandler;
use HiiincHomePortalApp\Includes\ServiceHandler;

class Loader {
    public function __construct() {
        new Assets();
        new Shortcodes();
        new SignupHandler();
        new SigninHandler();
        new CustomPostTypes();
        new Dashboard();
        new ProfileHandler();
        new ServiceHandler();
    }
}
