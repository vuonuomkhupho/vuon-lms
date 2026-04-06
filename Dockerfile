FROM frappe/bench:latest

ARG FRAPPE_BRANCH=version-16
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

# Install apps — LMS only, no ERPNext
RUN bench get-app --branch=${LMS_BRANCH} lms && \
    bench get-app --branch=${DFP_BRANCH} https://github.com/developmentforpeople/dfp_external_storage

# Build frontend assets
RUN bench build

# Copy entrypoint
COPY --chown=frappe:frappe scripts/entrypoint.sh /home/frappe/entrypoint.sh
RUN chmod +x /home/frappe/entrypoint.sh

EXPOSE 8000 9000

# Run as root so we can fix volume/log permissions at startup
USER root
RUN mkdir -p /logs && chown frappe:frappe /logs

ENTRYPOINT ["/home/frappe/entrypoint.sh"]
CMD ["bench", "start"]
