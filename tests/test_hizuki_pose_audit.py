"""Tests for body-local left/right gait contract; run python -m unittest discover -s tests -p 'test_hizuki_pose_audit.py'."""
import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("pose_audit", ROOT / "tools/hizuki_pose_audit.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def pose():
    return {"joints": {
        "rightShoulder": [.28, 1.57, 0], "rightElbow": [.39, 1.29, -.19],
        "rightWrist": [.42, 1.05, -.34],
        "leftShoulder": [-.28, 1.57, 0], "leftElbow": [-.39, 1.29, .19],
        "leftWrist": [-.42, 1.05, .34],
        "rightHip": [.16, 1., 0], "rightKnee": [.18, .58, .27],
        "rightAnkle": [.18, .1, .43],
        "leftHip": [-.16, 1., 0], "leftKnee": [-.18, .58, -.25],
        "leftAnkle": [-.18, .1, -.39],
    }}

class AuditTest(unittest.TestCase):
    def test_right_forward_pass(self):
        self.assertEqual(mod.audit(pose(), "right_forward"), [])
    def test_left_forward_pass(self):
        p = pose()
        p["joints"]["leftAnkle"][2] = .43
        p["joints"]["rightAnkle"][2] = -.39
        p["joints"]["rightWrist"][2] = .34
        p["joints"]["leftWrist"][2] = -.34
        self.assertEqual(mod.audit(p, "left_forward"), [])
    def test_reversed_legs_fail(self):
        p = pose()
        p["joints"]["rightAnkle"][2], p["joints"]["leftAnkle"][2] = p["joints"]["leftAnkle"][2], p["joints"]["rightAnkle"][2]
        self.assertTrue(any("right foot not forward" in e for e in mod.audit(p, "right_forward")))
    def test_reversed_arms_fail(self):
        p=pose()
        p["joints"]["rightWrist"][2],p["joints"]["leftWrist"][2]=p["joints"]["leftWrist"][2],p["joints"]["rightWrist"][2]
        self.assertTrue(any("left arm not forward" in e for e in mod.audit(p,"right_forward")))
    def test_swapped_body_side_fail(self):
        p=pose()
        p["joints"]["rightHip"][0],p["joints"]["leftHip"][0]=p["joints"]["leftHip"][0],p["joints"]["rightHip"][0]
        self.assertTrue(any("hips" in e for e in mod.audit(p,"right_forward")))
    def test_missing_joint_fail(self):
        p=pose()
        del p["joints"]["rightAnkle"]
        self.assertTrue(any("rightAnkle" in e for e in mod.audit(p,"right_forward")))
    def test_non_finite_fail(self):
        p=pose()
        p["joints"]["leftWrist"][2]=float("nan")
        self.assertTrue(mod.audit(p,"right_forward"))
    def test_bool_coordinates_fail(self):
        p=pose()
        p["joints"]["rightAnkle"][2]=True
        self.assertTrue(mod.audit(p,"right_forward"))
    def test_neutral_not_forward(self):
        p=pose()
        p["joints"]["rightAnkle"][2]=0
        p["joints"]["leftAnkle"][2]=0
        self.assertTrue(mod.audit(p,"right_forward"))

if __name__=="__main__": unittest.main()
