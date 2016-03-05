#!/bin/bash

#This should leave you with two files, cert.pem (the certificate) and key.pem (the private key). This is all you need for a SSL connection.

openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem

