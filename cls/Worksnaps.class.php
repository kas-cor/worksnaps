<?php

class Worksnaps {

    private $api_token;

    public function __construct($api_token) {
        $this->api_token = $api_token;
    }

    public function me() {
        return $this->api("me");
    }

    public function projects() {
        return $this->api("projects");
    }

    public function projectReport($project_id, $from_timestamp, $to_timestamp, $user_ids) {
        return $this->api("projects/" . $project_id . "/reports", [
                    'name' => 'time_summary',
                    'from_timestamp' => $from_timestamp,
                    'to_timestamp' => $to_timestamp,
                    'user_ids' => $user_ids,
        ]);
    }

    private function api($method, $data = []) {
        $curl_handle = curl_init();
        curl_setopt($curl_handle, CURLOPT_URL, "https://api.worksnaps.com/api/" . $method . "?" . http_build_query($data));
        curl_setopt($curl_handle, CURLOPT_HTTPHEADER, [
            'Authorization: Basic ' . base64_encode($this->api_token . ":ignored"),
            'Cache-Control: no-cache',
        ]);
        curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($curl_handle);
        curl_close($curl_handle);
        $xml = simplexml_load_string($response);
        return json_encode($xml);
    }

}
