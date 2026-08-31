package org.finos.vuu.api;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("JoinToBuilder Unit Tests")
class JoinToBuilderTest {

    private final TableDef tableDef = new TableDefBuilder()
            .name("myTable")
            .keyField("myKey")
            .build();

    private JoinToBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new JoinToBuilder();
    }

    @Nested
    @DisplayName("Successful Construction Tests")
    class SuccessfulBuildTests {

        @Test
        @DisplayName("Should build JoinTo with default joinType when joinType is omitted")
        void shouldBuildWithDefaultJoinType() {

            JoinTo result = builder
                    .table(tableDef)
                    .leftKey("orderId")
                    .rightKey("id")
                    .build();

            assertNotNull(result);
            assertSame(tableDef, result.table());

            JoinSpec spec = result.joinSpec();
            assertEquals("orderId", spec.left());
            assertEquals("id", spec.right());
            assertEquals(LeftOuterJoin$.MODULE$, spec.joinType());
        }

        @Test
        @DisplayName("Should build JoinTo with explicitly configured custom joinType")
        void shouldBuildWithCustomJoinType() {
           JoinType stubJoinType = LeftOuterJoin$.MODULE$;

            JoinTo result = builder
                    .table(tableDef)
                    .leftKey("orderId")
                    .rightKey("id")
                    .joinType(stubJoinType)
                    .build();

            assertNotNull(result);
            assertSame(tableDef, result.table());

            JoinSpec spec = result.joinSpec();
            assertEquals("orderId", spec.left());
            assertEquals("id", spec.right());
            assertSame(stubJoinType, spec.joinType());
        }

        @Test
        @DisplayName("Should maintain method chaining integrity")
        void shouldReturnSameBuilderInstanceOnChaining() {
            JoinType stubJoinType = LeftOuterJoin$.MODULE$;

            JoinToBuilder b1 = builder.table(tableDef);
            JoinToBuilder b2 = builder.leftKey("left");
            JoinToBuilder b3 = builder.rightKey("right");
            JoinToBuilder b4 = builder.joinType(stubJoinType);

            assertSame(builder, b1);
            assertSame(builder, b2);
            assertSame(builder, b3);
            assertSame(builder, b4);
        }
    }

    @Nested
    @DisplayName("Null-Safety Tests")
    class NullSafetyTests {

        @Test
        @DisplayName("Should throw NullPointerException when setting null table")
        void shouldThrowNpeOnNullTable() {
            assertThrows(NullPointerException.class, () -> builder.table(null));
        }

        @Test
        @DisplayName("Should throw NullPointerException when setting null leftKey")
        void shouldThrowNpeOnNullLeftKey() {
            assertThrows(NullPointerException.class, () -> builder.leftKey(null));
        }

        @Test
        @DisplayName("Should throw NullPointerException when setting null rightKey")
        void shouldThrowNpeOnNullRightKey() {
            assertThrows(NullPointerException.class, () -> builder.rightKey(null));
        }

        @Test
        @DisplayName("Should throw NullPointerException when setting null joinType")
        void shouldThrowNpeOnNullJoinType() {
            assertThrows(NullPointerException.class, () -> builder.joinType(null));
        }

        @Test
        @DisplayName("Should throw NullPointerException on build if table is missing")
        void shouldThrowNpeOnBuildMissingTable() {
            builder.leftKey("left").rightKey("right");
            assertThrows(NullPointerException.class, () -> builder.build());
        }

        @Test
        @DisplayName("Should throw NullPointerException on build if leftKey is missing")
        void shouldThrowNpeOnBuildMissingLeftKey() {
            builder.table(tableDef).rightKey("right");
            assertThrows(NullPointerException.class, () -> builder.build());
        }

        @Test
        @DisplayName("Should throw NullPointerException on build if rightKey is missing")
        void shouldThrowNpeOnBuildMissingRightKey() {
            builder.table(tableDef).leftKey("left");
            assertThrows(NullPointerException.class, () -> builder.build());
        }
    }
}