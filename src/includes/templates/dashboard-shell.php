<?php
// templates/dashboard-shell.php
?>
<!doctype html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title><?php echo esc_html(get_the_title()); ?></title>
    <?php // keep or remove wp_head as you need 
    ?>
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
    <div id="dashboard-root">
        <!-- React app will mount here -->
    </div>
    <?php wp_footer(); ?>
</body>

</html>