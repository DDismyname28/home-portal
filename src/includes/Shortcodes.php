<?php

namespace HiiincHomePortalApp\Includes;

class Shortcodes {

    public function __construct() {
        add_shortcode('react_signup_form', [$this, 'render_signup_form']);
        // 👉 You can register more shortcodes here later
        // e.g. add_shortcode('vendor_dashboard', [$this, 'render_dashboard']);
    }

    public function render_signup_form() {
        ob_start();
?>
        <div id="root-signup-root"></div>
<?php
        return ob_get_clean();
    }
}
