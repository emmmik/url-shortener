from locust import HttpUser, task, between

class URLShortenerTester(HttpUser):
    wait_time = between(0.1, 0.5)

    @task
    def test_redis_cache(self):
        with self.client.get("/7", allow_redirects=False, catch_response=True) as response:
            if response.status_code == 307:
                response.success()
            else:
                response.failure(f"Failed! Got status code: {response.status_code}")