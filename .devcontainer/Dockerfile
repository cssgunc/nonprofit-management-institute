# Use the latest official Node.js image
FROM node:latest

# Install useful system utilities
ENV TZ=America/New_York
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
	&& apt-get install --yes \
        apt-transport-https \
        build-essential \
        ca-certificates \
	    curl \
        debian-keyring \
        debian-archive-keyring \
	    git \
        gnupg \
        locales \
        postgresql-client \
        software-properties-common \
        sudo \
        tzdata \
        wget \
        zsh \
    && rm -rf /var/lib/apt/lists/*
    
# Create and set the working directory
RUN mkdir /workspace
WORKDIR /workspace

# Copy the entire project into the environment
COPY . .

# Expose ports
EXPOSE 3000

# Configure zsh shell and theme
USER node
ENV HOME /home/node
ENV RUNZSH=no CHSH=no KEEP_ZSHRC=yes
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
