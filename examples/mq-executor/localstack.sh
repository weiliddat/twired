#!/bin/bash

aws configure set region "us-east-1" --profile localstack
aws configure set output json --profile localstack
aws configure set aws_access_key_id localstack --profile localstack
aws configure set aws_secret_access_key localstack --profile localstack

aws --profile=localstack --endpoint-url=http://localstack:4566 sqs create-queue --queue-name sendBirthdayGreeting
aws --profile=localstack --endpoint-url=http://localstack:4566 sqs create-queue --queue-name generateAndSendGreeting
aws --profile=localstack --endpoint-url=http://localstack:4566 sqs create-queue --queue-name sendEmail
aws --profile=localstack --endpoint-url=http://localstack:4566 sqs create-queue --queue-name saveEmail
