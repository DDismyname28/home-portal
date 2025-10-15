<?php

/**
 * Plugin Name:       Home Services Portal
 * Plugin URI:        https://hiiinc.net
 * Description:       Hiiinc Home Services Portal.
 * Version:           1.0.0
 * Author:            Djofil Demerin
 * Author URI:        https://hiiinc.net
 */

if (!defined('ABSPATH')) exit;

require_once __DIR__ . '/vendor/autoload.php';

use HiiincHomePortalApp\Loader;
use HiiincHomePortalApp\Includes\RegisterRoles;
use HiiincHomePortalApp\Includes\Dashboard;

register_activation_hook(__FILE__, [RegisterRoles::class, 'activate']);
register_deactivation_hook(__FILE__, [RegisterRoles::class, 'deactivate']);

// add dashboard page hooks
register_activation_hook(__FILE__, [Dashboard::class, 'activate']);
register_deactivation_hook(__FILE__, [Dashboard::class, 'deactivate']);

add_action('plugins_loaded', function () {
    new Loader();
});
