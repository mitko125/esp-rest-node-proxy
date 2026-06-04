idf_component_register(SRCS "esp_rest_main.c"
                            "rest_server.c"
                       PRIV_REQUIRES esp_http_server nvs_flash
                       INCLUDE_DIRS ".")

littlefs_create_partition_image(www ../html_files FLASH_IN_PROJECT)