import { Graph, Shape } from "./api";

export type DatumType = "1" | "2" | "property" | "requirement";

export type DatumID =
    | "precise"
    | "imprecise"
    | "unexpected"
    | "counting"
    | "choice"
    | "adjustment"
    | "set_once"
    | "known"
    | "unknown"
    | "bounded"
    | "unbounded"
    | "speed_important"
    | "speed_not_important"
    // split
    | "stepped"
    | "wrapped"
    | "control_over_each_place_value"
    | "control_over_degree_of_precision"
    | "number_is_thing_of_interest"
    | "show_number_in_feedback"
    | "number_not_real_thing_of_interest"
    | "sketch_of_a number"
    | "may_evolve_into_needing_precise_value"
    | "often_random"
    | "mapped_to_something_unusual"
    | "form_of_exploration"
    | "looking_for_surprise"
    | "breaking_from_self"
    | "keeping_track_of_something"
    | "primarily_increasing_not_decreasing"
    | "limited_selection"
    | "decreased_range"
    | "increased_precision"
    | "minimise_error"
    | "adjustment_low_priority"
    | "adjustment_important"
    | "prioritise_speed"
    | "ease_of_comparison_important"
    | "excluding_useless_or_dangerous_values"
    | "be_fast!"
    | "use_small_muscles"
    | "can_use_big_muscles"
    | "speed_or_number_of_steps_low_priority"
    | "avoid_modal_changes"
    | "fluent_mental_model"
    | "increment_control"
    | "decrement_control"
    | "reset_control";

export const defGraph = (shape: Shape): Graph => {
    const defaultDatum = {
        x: shape.width * 0.5,
        y: shape.height * 0.5,
        enabledBy: [],
        disabledBy: [],
        properties: [],
        userEnabled: false,
    };

    return {
        types: [
            {
                ...defaultDatum,
                id: "precise",
                type: "1",
                enabledBy: [["choice"]],
                disabledBy: [["imprecise"]],
                properties: [
                    "control_over_each_place_value",
                    "control_over_degree_of_precision",
                    "number_is_thing_of_interest",
                ],
            },
            {
                ...defaultDatum,
                id: "imprecise",
                type: "1",
                disabledBy: [["precise"], ["choice"]],
                properties: [
                    "number_not_real_thing_of_interest",
                    "sketch_of_a number",
                    "may_evolve_into_needing_precise_value",
                ],
            },
            {
                ...defaultDatum,
                id: "unexpected",
                type: "1",
                disabledBy: [["counting"], ["known"]],
                properties: [
                    "often_random",
                    "mapped_to_something_unusual",
                    "form_of_exploration",
                    "looking_for_surprise",
                    "breaking_from_self",
                ],
            },
            {
                ...defaultDatum,
                id: "counting",
                type: "1",
                disabledBy: [["unexpected"]],
                properties: [
                    "keeping_track_of_something",
                    "primarily_increasing_not_decreasing",
                    "increment_control",
                    "decrement_control",
                    "reset_control",
                ],
            },
            {
                ...defaultDatum,
                id: "choice",
                type: "1",
                disabledBy: [["unbounded"], ["known"], ["counting"]],
                properties: ["limited_selection"],
            },
            {
                ...defaultDatum,
                id: "adjustment",
                type: "2",
                disabledBy: [["set_once"]],
                properties: [
                    "decreased_range",
                    "increased_precision",
                    "avoid_modal_changes",
                    "fluent_mental_model",
                ],
            },
            {
                ...defaultDatum,
                id: "set_once",
                type: "2",
                disabledBy: [["adjustment"]],
                properties: ["speed_or_number_of_steps_low_priority"],
            },
            {
                ...defaultDatum,
                id: "known",
                type: "2",
                disabledBy: [["unknown"]],
                properties: ["minimise_error", "adjustment_low_priority"],
            },
            {
                ...defaultDatum,
                id: "unknown",
                type: "2",
                disabledBy: [["known"]],
                properties: [
                    "adjustment_important",
                    "prioritise_speed",
                    "ease_of_comparison_important",
                ],
            },
            {
                ...defaultDatum,
                id: "bounded",
                type: "2",
                enabledBy: [["choice"], ["known", "unexpected"]],
                disabledBy: [["unbounded"]],
                properties: ["stepped", "wrapped", "excluding_useless_or_dangerous_values"],
            },
            {
                ...defaultDatum,
                id: "unbounded",
                type: "2",
                disabledBy: [["bounded"], ["choice"]],
            },
            {
                ...defaultDatum,
                id: "speed_important",
                type: "2",
                disabledBy: [["speed_not_important"]],
                properties: ["use_small_muscles"],
            },
            {
                ...defaultDatum,
                id: "speed_not_important",
                type: "2",
                disabledBy: [["speed_important"]],
                properties: ["can_use_big_muscles"],
            },
        ],
        properties: [
            {
                ...defaultDatum,
                id: "stepped",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "wrapped",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "control_over_each_place_value",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "control_over_degree_of_precision",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "number_is_thing_of_interest",
                type: "requirement",
                properties: ["show_number_in_feedback"],
            },
            {
                ...defaultDatum,
                id: "show_number_in_feedback",
                type: "requirement",
            },
            {
                ...defaultDatum,
                id: "number_not_real_thing_of_interest",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "sketch_of_a number",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "may_evolve_into_needing_precise_value",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "often_random",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "mapped_to_something_unusual",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "form_of_exploration",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "looking_for_surprise",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "breaking_from_self",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "keeping_track_of_something",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "primarily_increasing_not_decreasing",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "limited_selection",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "decreased_range",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "increased_precision",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "minimise_error",
                type: "requirement",
            },
            {
                ...defaultDatum,
                id: "adjustment_low_priority",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "adjustment_important",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "prioritise_speed",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "ease_of_comparison_important",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "excluding_useless_or_dangerous_values",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "be_fast!",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "use_small_muscles",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "can_use_big_muscles",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "speed_or_number_of_steps_low_priority",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "avoid_modal_changes",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "fluent_mental_model",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "increment_control",
                type: "requirement",
                enabledBy: [["counting"]],
            },
            {
                ...defaultDatum,
                id: "decrement_control",
                type: "property",
            },
            {
                ...defaultDatum,
                id: "reset_control",
                type: "requirement",
                enabledBy: [["counting"]],
            },
        ],
        links: [],
    };
};
