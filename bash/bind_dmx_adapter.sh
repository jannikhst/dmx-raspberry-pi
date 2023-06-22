sleep 3
usb_device=$(ola_dev_info | grep "FT232R" | awk -F ": " '{print $1}' | awk '{print $2}' | head -1)
usb_port=$(ola_dev_info | grep "FT232R" | grep -Po "(?<=port )\d+" | head -1)
ola_patch -d "$usb_device" -p "$usb_port" -u 0