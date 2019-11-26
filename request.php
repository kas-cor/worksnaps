<?php

Error_Reporting(E_ALL & ~E_NOTICE);

if ($request = json_decode(file_get_contents('php://input'))) {
    require __DIR__ . '/cls/Worksnaps.class.php';
    $worksnaps = New Worksnaps($request->api_token);
    switch ($request->action) {
        case "me":
            die($worksnaps->me());
            break;
        case "projects":
            die($worksnaps->projects());
            break;
        case "report":
            $from_timestamp = strtotime(date("01.m.Y 00:00:00"));
            $to_timestamp = strtotime(date("t.m.Y 23:59:59")) + 1;
            die($worksnaps->projectReport($request->id, $from_timestamp, $to_timestamp, $request->user));
            break;
        default:
            die('{"error":"Unknown action"}');
            break;
    }
} else {
    die('{"error":"Empty params"}');
}
