import re
p = "frontend/src/components/InteractiveCube.tsx"
s = open(p, encoding="utf-8").read()

# 旧逻辑：用盒体局部法线判定点击面，打乱后失效 -> 改为世界法线逆轨道变换回引擎坐标
pat = re.compile(
    r"      const n = hit\.face!\.normal\.clone\(\);.*\n"
    r"      const faceId = faceIdOfDir\(\[n\.x, n\.y, n\.z\]\);"
)
repl = (
    "      // world normal of hit face -> convert back to engine space via inverse orbit "
    "rotation (handles scrambled cubies)\n"
    "      const nWorld = hit.face!.normal.clone().transformDirection(hit.object.matrixWorld);\n"
    "      const nEngine = nWorld.applyQuaternion(t.orbit.quaternion.clone().invert());\n"
    "      const faceId = faceIdOfDir([Math.round(nEngine.x), Math.round(nEngine.y), Math.round(nEngine.z)]);"
)
assert pat.search(s), "pattern not found in file"
s2 = pat.sub(repl, s)
open(p, "w", encoding="utf-8").write(s2)
print("OK: replaced face-detection block; nEngine occurrences =", s2.count("nEngine"))
