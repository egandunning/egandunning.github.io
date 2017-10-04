import bluetooth
import os

###
#setup socket, accept connection from client and
#receive data
###
def connect_recv_loop():

	def close_resources():
		client_sock.close
		server_sock.close

	port = 11 #pick a port between 10 and 30

	#RFCOMM port
	server_sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)

	#the UUID must match the UUID in the client program
	uuid = "00000000-0000-0001-0000-000000000001"

	#setup the socket
	server_sock.bind(("", port))
	server_sock.listen(1)

	bluetooth.advertise_service(server_sock, "bluemouse", uuid)

	#accept the connection
	client_sock, address = server_sock.accept()
	print "connected"

	#receive data
	while(True):
		data = client_sock.recv(64)
		code = data[0]
		data = data[1:]

		try:

			if code == "m": #mouse movement
				os.system("xdotool mousemove_relative -- %s" % data)

			elif code == "1": #mouse1
				os.system("xdotool click 1")

			elif code == "2": #mouse2
				os.system("xdotool click 2")

			elif code == "3": #mouse3
				os.system("xdotool click 3")

			elif code == "p": #key pressed
				os.system("xdotool key %s" % data )

			elif code == "s": #shutdown
				os.system("sleep 1 && sudo shutdown -h now")
				close_resources()
				return False

			elif code == "c": #close connection
				close_resources()
				return True
		except Exception:
			pass
		
	close_resources()

###
# Open a connection and receive messages. When a connection is closed,
# start over. When a shutdown message is received, exit the program.
###
while(connect_recv_loop()):
	print "connection closed"

print "exiting"
