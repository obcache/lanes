<?php
// Put the real configuration OUTSIDE the document root/artifact and point
// LANES_CONFIG at its absolute filename in Apache's environment.
return [
    "base_url" => "https://lanes.example.com",
    "db_dsn" => "mysql:host=127.0.0.1;dbname=lanes;charset=utf8mb4",
    "db_user" => "lanes",
    "db_password" => "",
    "storage_path" => "/var/lib/lanes",
    "oidc_issuer" => "https://identity.example.com",
    "oidc_client_id" => "",
    "oidc_client_secret" => "",
    "oidc_groups_claim" => "groups",
    "player_group" => "lanes-players",
    "admin_group" => "lanes-admins",
];
