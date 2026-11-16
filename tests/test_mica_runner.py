"""Unit tests only. Generated OBJ fixtures are NOT inferred 3D heads."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[1] / "tools" / "mica" / "run_mica.py"
spec = importlib.util.spec_from_file_location("photo3d_mica_runner", SOURCE)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


def grid_obj(size=11):
    lines = ["# synthetic test geometry; never an AI model output"]
    for y in range(size):
        for x in range(size):
            lines.append(f"v {x} {y} {(x * x + y) / 100}")
    for y in range(size - 1):
        for x in range(size - 1):
            a = y * size + x + 1
            b, c, d = a + 1, a + size, a + size + 1
            lines.extend([f"f {a} {b} {c}", f"f {b} {d} {c}"])
    return "\n".join(lines) + "\n"


class MicaBridgeTests(unittest.TestCase):
    def test_valid_obj_metrics_and_bounds(self):
        with tempfile.TemporaryDirectory() as directory:
            obj = Path(directory) / "mesh.obj"
            obj.write_text(grid_obj(), encoding="utf-8")
            data = runner.inspect_obj(obj)
            self.assertEqual(data["vertices"], 121)
            self.assertEqual(data["triangles"], 200)
            self.assertEqual(data["boundsMm"]["min"], [0, 0, 0])
            self.assertEqual(data["boundsMm"]["max"], [10, 10, 1.1])

    def test_bad_triangles_or_absent_output_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            obj = Path(directory) / "mesh.obj"
            with self.assertRaisesRegex(ValueError, "did not create"):
                runner.inspect_obj(obj)
            obj.write_text(grid_obj().replace("f 1 2 12", "f 1 1 12"))
            with self.assertRaisesRegex(ValueError, "Degenerate"):
                runner.inspect_obj(obj)
            obj.write_text(grid_obj().replace("f 1 2 12", "f 1 2 999"))
            with self.assertRaisesRegex(ValueError, "missing or later"):
                runner.inspect_obj(obj)

    def test_missing_license_assets_prevents_claims_of_readiness(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            issues = runner.check_environment(root, None, check_cuda=False)
            self.assertTrue(any("mica.tar" in issue for issue in issues))
            self.assertTrue(any("generic_model.pkl" in issue for issue in issues))
            self.assertTrue(any("InsightFace" in issue for issue in issues))
            with self.assertRaises(SystemExit):
                runner.main(["--mica-root", str(root)])


if __name__ == "__main__":
    unittest.main()
