<?php

/**
 * Class Worksnaps
 */
class Worksnaps {

    /**
     * @var string API token WorkSnaps
     */
    private $api_token;

    /**
     * Worksnaps constructor.
     * @param string $api_token API token WorkSnaps
     */
    public function __construct($api_token) {
        $this->api_token = $api_token;
    }

    /**
     * Method me
     * @return false|string response
     */
    public function me() {
        return $this->api("me");
    }

    /**
     * Method projects
     * @return false|string response
     */
    public function projects() {
        return $this->api("projects");
    }

    /**
     * Method projectReport
     * @param $project_id
     * @param $from_timestamp
     * @param $to_timestamp
     * @param $user_ids
     * @return false|string response
     */
    public function projectReport($project_id, $from_timestamp, $to_timestamp, $user_ids) {
        return $this->api("projects/" . $project_id . "/reports", [
            'name' => 'time_summary',
            'from_timestamp' => $from_timestamp,
            'to_timestamp' => $to_timestamp,
            'user_ids' => $user_ids,
        ]);
    }

    /**
     * Send request to API
     * @param string $method Method name
     * @param array $data request data
     * @return false|string response
     */
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
        libxml_use_internal_errors(true);
        if (!$result = simplexml_load_string($response)) {
            foreach (libxml_get_errors() as $error) {
                $result['error'][] = $error->message;
            }
        }

        return json_encode($result);
    }

}
