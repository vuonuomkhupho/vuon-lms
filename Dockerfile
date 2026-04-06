FROM frappe/bench:latest

ARG FRAPPE_BRANCH=version-16
ARG ERPNEXT_BRANCH=version-16
ARG LMS_BRANCH=main
ARG DFP_BRANCH=develop

USER frappe
WORKDIR /home/frappe

# Initialize bench with Frappe framework
RUN bench init \
  --frappe-branch=${FRAPPE_BRANCH} \
  --skip-redis-config-generation \
  --skip-assets \
  frappe-bench

WORKDIR /home/frappe/frappe-bench

# Install apps
RUN bench get-app --branch=${ERPNEXT_BRANCH} erpnext && \
    bench get-app --branch=${LMS_BRANCH} lms && \
    bench get-app --branch=${DFP_BRANCH} https://github.com/developmentforpeople/dfp_external_storage

# Build frontend assets
RUN bench build

# Frappe v16 expects /logs directory for logging
RUN mkdir -p /logs && chown frappe:frappe /logs

# Copy entrypoint
COPY --chown=frappe:frappe scripts/entrypoint.sh /home/frappe/entrypoint.sh
RUN chmod +x /home/frappe/entrypoint.sh

EXPOSE 8000 9000

# Run as root so we can fix volume permissions at startup
# The entrypoint handles running bench as the frappe user
USER root

ENTRYPOINT ["/home/frappe/entrypoint.sh"]
CMD ["bench", "start"]
