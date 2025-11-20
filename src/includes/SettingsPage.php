<?php

namespace HiiincHomePortalApp\Includes;

if (!defined('ABSPATH')) exit;

class SettingsPage {
    const OPTION_KEY = 'homeportal_google_maps_api_key';
    const OPTION_KEY_PROPERTY = 'homeportal_property_data_api_key';

    public function __construct() {
        add_action('admin_menu', [$this, 'add_settings_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('rest_api_init', [$this, 'register_rest_route']);
    }

    /**
     * Register REST API endpoint for React app to fetch API keys.
     */
    public function register_rest_route() {
        register_rest_route('home-portal/v1', '/settings', [
            'methods'  => 'GET',
            'callback' => [$this, 'rest_get_settings'],
            'permission_callback' => [$this, 'rest_permission'],
        ]);
    }

    /**
     * REST callback function
     */
    public function rest_get_settings() {
        return [
            'success'           => true,
            'googleMapsApiKey'  => get_option(self::OPTION_KEY),
            'propertyApiKey'    => get_option(self::OPTION_KEY_PROPERTY)
        ];
    }

    /**
     * ✅ Permission callback so only logged-in users can access keys.
     * Change to `current_user_can('manage_options')` if only admin should access.
     */
    public function rest_permission() {
        return is_user_logged_in();
    }

    /**
     * Add admin settings page
     */
    public function add_settings_menu() {
        add_options_page(
            __('Home Portal Settings', 'hiiinc-home-portal'),
            __('Home Portal', 'hiiinc-home-portal'),
            'manage_options',
            'home_portal_settings',
            [$this, 'render_settings_page']
        );
    }

    /**
     * Register settings + fields
     */
    public function register_settings() {

        register_setting('hiiinc_home_portal_group', self::OPTION_KEY);
        register_setting('hiiinc_home_portal_group', self::OPTION_KEY_PROPERTY);

        add_settings_section(
            'homeportal_api_section',
            __('API Keys', 'hiiinc-home-portal'),
            function () {
                echo '<p>' . __('Enter your API keys below.', 'hiiinc-home-portal') . '</p>';
            },
            'home_portal_settings'
        );

        add_settings_field(
            self::OPTION_KEY,
            __('Google Maps API Key', 'hiiinc-home-portal'),
            function () {
                $value = esc_attr(get_option(self::OPTION_KEY, ''));
                echo '<input type="text" name="' . self::OPTION_KEY . '" class="regular-text" value="' . $value . '" placeholder="Enter Google Maps API key" />';
            },
            'home_portal_settings',
            'homeportal_api_section'
        );

        add_settings_field(
            self::OPTION_KEY_PROPERTY,
            __('Property Data API Key', 'hiiinc-home-portal'),
            function () {
                $value = esc_attr(get_option(self::OPTION_KEY_PROPERTY, ''));
                echo '<input type="text" name="' . self::OPTION_KEY_PROPERTY . '" class="regular-text" value="' . $value . '" placeholder="Enter Property Data API key" />';
            },
            'home_portal_settings',
            'homeportal_api_section'
        );
    }

    /**
     * Render admin settings page
     */
    public function render_settings_page() {
?>
        <div class="wrap">
            <h1><?php _e('Home Portal Settings', 'hiiinc-home-portal'); ?></h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('hiiinc_home_portal_group');
                do_settings_sections('home_portal_settings');
                submit_button();
                ?>
            </form>
        </div>
<?php
    }
}
