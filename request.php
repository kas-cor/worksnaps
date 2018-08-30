<?php

Error_Reporting(E_ALL & ~E_NOTICE);

include_once './cls/Worksnaps.class.php';

$worksnaps = New Worksnaps($_POST['api_token']);

if ($_POST['action'] == "me") {
    die($worksnaps->me());
}

if ($_POST['action'] == "projects") {
    die($worksnaps->projects());
}

if ($_POST['action'] == "report") {
    $from_timestamp = strtotime(date("01.m.Y 00:00:00"));
    $to_timestamp = strtotime(date("t.m.Y 23:59:59")) + 1;
    die($worksnaps->projectReport($_POST['id'], $from_timestamp, $to_timestamp, $_POST['user']));
}
