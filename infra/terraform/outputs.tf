# Generated secrets — mark sensitive so they never print in plan/apply logs.
# Consume via `terraform output -raw jwt_access_secret` into your secret store.
output "jwt_access_secret"  { value = random_password.jwt_access.result,  sensitive = true }
output "jwt_refresh_secret" { value = random_password.jwt_refresh.result, sensitive = true }
output "admin_access_code"  { value = random_password.admin_gate.result,  sensitive = true }
output "metrics_token"      { value = random_password.metrics.result,     sensitive = true }
