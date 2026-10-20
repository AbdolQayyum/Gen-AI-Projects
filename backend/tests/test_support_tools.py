from app.tools.support import calculator


def test_calculator_handles_basic_arithmetic():
    assert calculator.invoke({"expression": "(25 * 4) + 8"}) == "108"


def test_calculator_rejects_non_finite_and_complex_results():
    assert "outside the supported range" in calculator.invoke({"expression": "1e999"})
    assert "outside the supported range" in calculator.invoke({"expression": "(-1) ** 0.5"})
