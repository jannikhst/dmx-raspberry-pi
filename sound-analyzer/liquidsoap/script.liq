env = environment()
in_url = env["ICECAST_URL"]
out_url = env["OUT_URL"]
print("url: #{in_url}")

def post(data) =
    ignore(process.run("curl -X POST -H 'Content-Type: application/json' --data '#{data}' #{out_url}"))
    print("posted: #{data}")
end

s = input.http(in_url)
s_bpm = bpm(s)
s_rms = rms(duration=2.,s)

thread.run(every=1., fun () -> post("{\"bpm\": #{s_bpm.bpm()}, \"rms\": #{s_rms.rms()}}"))
output.dummy(fallible=true, s_bpm)
output.dummy(fallible=true, s_rms)
