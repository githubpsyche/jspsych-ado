from ado_service.dd_engine import DelayDiscountingSession


def test_delay_discounting_session_updates():
    session = DelayDiscountingSession()
    first_design = session.next_design

    assert set(first_design) == {"t_ss", "t_ll", "r_ss", "r_ll"}
    assert session.trial_index == 0

    result = session.update(first_design, {"choice": 1})

    assert result["trial_index"] == 1
    assert set(result["next_design"]) == {"t_ss", "t_ll", "r_ss", "r_ll"}
    assert set(result["post_mean"]) == {"k", "tau"}
    assert set(result["post_sd"]) == {"k", "tau"}

